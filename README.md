# Ubuntu Entra ID Configurator

This is a simple web-based tool to generate `cloud-init` (autoinstall) configurations for Ubuntu 24.04 LTS that enforce Microsoft Entra ID authentication.

## Prerequisites: Azure App Registration

Before using this tool, you must create an App Registration in Microsoft Entra ID:

1.  **Create App Registration**:
    *   Go to **Entra ID > App registrations > New registration**.
    *   **Name**: e.g., `Ubuntu-Device-Auth`.
    *   **Supported account types**: Single tenant.
    *   **Redirect URI**: Select **Public client/native** and enter: `msauth://com.microsoft.identity.client.sample.local/SignatureHash`
2.  **Enable Public Client**:
    *   Go to **Authentication** > **Advanced settings**.
    *   Set **Allow public client flows** to **Yes**.
3.  **API Permissions**:
    *   Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated**.
    *   Add: `openid`, `profile`, `User.Read`, `offline_access`.
    *   **Grant admin consent** for your tenant.
4.  **Get IDs**:
    *   Copy the **Application (client) ID** and **Directory (tenant) ID** from the Overview page.

## Usage

1.  Open `index.html` in a web browser.
2.  Fill in your Azure Tenant ID and Client ID.
3.  Configure optional settings (hostname, local admin).
4.  Click "Generate Configuration".
5.  Download the `user-data` file.

## Hosting on GitHub Pages

To host this tool on GitHub Pages:

1.  Push this folder to your GitHub repository.
2.  Go to your repository settings -> Pages.
3.  Select the source as the branch containing this folder.
4.  If this is in a subfolder (like it is now), you might need to configure the build source or just access it via the direct URL path: `https://<username>.github.io/<repo-name>/01_Entra/01_EntraID_Ubuntu_Configurator/index.html`.

## How it works

The tool generates a YAML file compatible with Ubuntu's Autoinstall feature. It injects a script that runs on the first boot to:

1.  Install `authd` and `authd-msentra`.
2.  Configure the Entra ID broker.
3.  (Optional) Lock the local admin account to enforce Entra ID login.
