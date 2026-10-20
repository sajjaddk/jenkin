# Jenkins setup on Ubuntu Server

Step-by-step guide for installing Jenkins on a home Ubuntu Server (22.04 or 24.04) and connecting it to this repo. Run the commands over SSH. Total time: about 30–45 minutes.

> **Security first:** keep Jenkins on your home network. Do **not** port-forward port 8080 on your router. Public Jenkins servers are attacked constantly, and Jenkins can run any code you give it.

## 1. Prepare the server
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl fontconfig ca-certificates
```

## 2. Java (needed by Jenkins)
```bash
sudo apt install -y openjdk-21-jre
java -version
```
(Java 17 also works with current Jenkins LTS, but Java 21 is the safer long-term choice.)

## 3. Jenkins (LTS)
```bash
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable --now jenkins
systemctl status jenkins --no-pager
```

## 4. Node.js 22 and the libraries Cypress needs
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version && npm --version

# Cypress runs a real browser (Electron) with a virtual screen (xvfb)
# Ubuntu 24.04 uses libasound2t64; Ubuntu 22.04 uses libasound2
sudo apt install -y xvfb libgtk-3-0 libgbm1 libnss3 libxss1 libxtst6 xauth libnotify4 libasound2t64 \
  || sudo apt install -y xvfb libgtk-3-0 libgbm1 libnss3 libxss1 libxtst6 xauth libnotify4 libasound2
```
Optional: install Google Chrome if you want to run Cypress in Chrome instead of Electron.

### 4b. System libraries for Playwright
Playwright downloads its own Chromium during the build, but the operating-system libraries it needs must be installed once with administrator rights. Run this in the project folder on any computer with the repo (or on the server after cloning it):
```bash
git clone https://github.com/sajjaddk/jenkin.git ~/jenkin-setup
cd ~/jenkin-setup
npm ci
sudo env "PATH=$PATH" npx playwright install-deps chromium
cd ~ && rm -rf ~/jenkin-setup
```
The first pipeline run then downloads the browser itself (about 150 MB, stored in `/var/lib/jenkins/.cache/ms-playwright`).

## 5. Firewall (home network only)
Replace `192.168.0.0/16` with your own network range if different.
```bash
sudo ufw allow OpenSSH
sudo ufw allow from 192.168.0.0/16 to any port 8080 proto tcp
sudo ufw enable
sudo ufw status
```

## 6. First login
1. Find the server's address: `hostname -I`.
2. On another computer on your network, open `http://<server-ip>:8080`.
3. Get the unlock password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`.
4. Choose **Install suggested plugins**, then create your own admin user with a strong password.

## 7. Extra plugins
**Manage Jenkins → Plugins → Available plugins**, install:
- **HTML Publisher** (shows the API report)
- **Allure** (listed as *Allure Jenkins Plugin*; shows the Allure report)
- **Workspace Cleanup** and **Timestamper**, if not already installed

(Pipeline, Git and JUnit come with the suggested plugins.)

## 7b. Add the Allure Commandline tool
1. **Manage Jenkins → Tools**, scroll to **Allure Commandline** and click **Add Allure Commandline**.
2. Name: `allure` (it must match the `Jenkinsfile`).
3. Tick **Install automatically** and keep the default source (Maven Central). Pick the latest 2.x version.
4. **Save.** Allure needs Java, which the server already has (step 2).

## 8. Create the pipeline job
1. **New Item** → name `jenkins-qa-pipeline` → **Pipeline** → OK.
2. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/sajjaddk/jenkin.git` (public, so no credentials needed)
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Save, then click **Build with Parameters → Build** for the first run.

After the first run, the `pollSCM` trigger in the `Jenkinsfile` is active. Jenkins checks GitHub about every 5 minutes and builds when `main` has new commits. No webhook or open port is needed.

> This is a plain Pipeline job on `main`, not a multibranch job, so pull requests from other people are **never built** on your server.

## 9. Check it works
- The build page shows the **stage view** (Install, Lint, Tests).
- **Test Result** shows the Newman and Cypress results.
- **API report (Newman)** and **Playwright report** (left menu) show the HTML reports.
- **Allure Report** (left menu) shows the combined API and UI report with features, severity, steps and trends.
- **Build Artifacts** has the reports and any failure screenshots.

## 10. Make evidence for your portfolio
Recruiters can't open your home Jenkins, so save proof in the repo:
1. Take screenshots of the stage view, the test result page and the API report.
2. Save them in `docs/screenshots/` and link them from the README.
3. Optionally record a short screen capture of a push triggering a build.

## Troubleshooting
| Problem | Fix |
|---|---|
| `npm: command not found` in a build | Node isn't installed for the `jenkins` user: check step 4, then restart Jenkins (`sudo systemctl restart jenkins`) |
| Cypress: "Xvfb" or shared library errors | Install the libraries in step 4 |
| Playwright: "Host system is missing dependencies" | Run the command in step 4b (needs `sudo`) |
| Playwright browser missing | The Playwright stage runs `npx playwright install chromium` itself. If it fails, check the server's internet access and free disk space |
| Cypress binary missing | `sudo -u jenkins npx cypress install` from any folder, or re-run the build (the first run downloads it) |
| HTML report shows blank or unstyled | Jenkins blocks scripts in reports by default. Easiest: open the report from **Build Artifacts**. Or relax the policy in **Manage Jenkins → Script Console** (resets when Jenkins restarts): `System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "sandbox allow-scripts; default-src 'self'; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data:; font-src 'self' https: data:")` |
| "Allure report skipped" in the console | The Allure plugin or the tool named `allure` is missing: check steps 7 and 7b |
| Tests fail only on the server | The practice sites are public and can be slow. The UI tests retry twice. Re-run before assuming a bug. |
| Build never starts on its own | Run the job once manually so Jenkins registers the poll trigger; then check **Git Polling Log** |
