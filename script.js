document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const outputSection = document.getElementById('outputSection');
  const outputCode = document.getElementById('outputCode');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadMetaBtn = document.getElementById('downloadMetaBtn');

  generateBtn.addEventListener('click', generateConfig);
  resetBtn.addEventListener('click', resetForm);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  copyBtn.addEventListener('click', copyToClipboard);
  downloadBtn.addEventListener('click', downloadFile);
  downloadMetaBtn.addEventListener('click', downloadMetaFile);

  // Load dark mode preference
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
  }

  function generateConfig() {
    const tenantId = document.getElementById('tenantId').value.trim();
    const clientId = document.getElementById('clientId').value.trim();
    const hostname = document.getElementById('hostname').value.trim() || 'ubuntu-entra-device';
    const adminUser = document.getElementById('adminUser').value.trim() || 'localadmin';
    const adminPassword = document.getElementById('adminPassword').value.trim() || '$6$rounds=4096$saltsalt$oPlsJhYAjdiMg2KV6rKZP7JMwLqOCPqKvdvgaLTdHh8Wl0C.YLN5HWJFPTjJKF9czcJvL8rEVKPc3VqJKvYFZ1';
    const disableLocal = document.getElementById('disableLocal').checked;

    // Validate GUIDs
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const tenantIdError = document.getElementById('tenantIdError');
    const clientIdError = document.getElementById('clientIdError');

    tenantIdError.textContent = '';
    clientIdError.textContent = '';

    let hasError = false;

    if (!tenantId) {
      tenantIdError.textContent = '⚠️ Tenant ID is required';
      hasError = true;
    } else if (!guidRegex.test(tenantId)) {
      tenantIdError.textContent = '⚠️ Invalid GUID format';
      hasError = true;
    }

    if (!clientId) {
      clientIdError.textContent = '⚠️ Client ID is required';
      hasError = true;
    } else if (!guidRegex.test(clientId)) {
      clientIdError.textContent = '⚠️ Invalid GUID format';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const yaml = `#cloud-config
autoinstall:
  version: 1
  interactive-sections:
    - identity # Optional: Remove this if you want fully automated (no prompts)
  
  # 1. Identity Configuration
  identity:
    hostname: ${hostname}
    username: ${adminUser}
    password: "${adminPassword}"
    realname: Local Administrator

  # 2. First Boot Configuration (Cloud-Init)
  user-data:
    package_update: true
    package_upgrade: true

    # Add the AuthD PPA
    apt:
      sources:
        authd:
          source: "ppa:ubuntu-enterprise-desktop/authd"

    # Install AuthD package
    packages:
      - authd

    # Install Entra ID Broker Snap
    snap:
      commands:
        - ["install", "authd-msentra"]

    # Create Configuration Files
    write_files:
      - path: /var/snap/authd-msentra/current/broker.conf
        permissions: '0600'
        content: |
          [oidc]
          issuer = https://login.microsoftonline.com/${tenantId}/v2.0
          client_id = ${clientId}
          
          [users]
          allowed_users = ALL

      - path: /etc/gdm3/greeter.dconf-defaults
        append: true
        content: |
          
          [org/gnome/login-screen]
          disable-user-list=true

    # Run Setup Commands
    runcmd:
      # 1. Configure AuthD Broker
      - mkdir -p /etc/authd/brokers.d/
      - cp /snap/authd-msentra/current/conf/authd/msentra.conf /etc/authd/brokers.d/
      
      # 2. Increase Login Timeout (for MFA)
      - sed -i 's/^LOGIN_TIMEOUT.*/LOGIN_TIMEOUT 120/' /etc/login.defs || echo "LOGIN_TIMEOUT 120" >> /etc/login.defs

      # 3. Restart Services to apply changes
      - systemctl restart authd
      - snap restart authd-msentra

      ${disableLocal ? `# 4. SECURITY: Lock the local admin account
      # This enforces Entra ID login only.
      - passwd -l ${adminUser}` : '# Local admin account remains active'}
      
      # 5. Optional: Reboot to ensure clean state
      # - reboot
`;

    outputCode.textContent = yaml;
    outputSection.classList.remove('hidden');
    outputSection.scrollIntoView({ behavior: 'smooth' });
  }

  function copyToClipboard() {
    const text = outputCode.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  }

  function downloadFile() {
    const text = outputCode.textContent;
    const blob = new Blob([text], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-data';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadMetaFile() {
    const metaContent = 'instance-id: ubuntu-entra-' + Date.now();
    const blob = new Blob([metaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meta-data';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetForm() {
    document.getElementById('tenantId').value = '';
    document.getElementById('clientId').value = '';
    document.getElementById('hostname').value = 'ubuntu-entra-device';
    document.getElementById('adminUser').value = 'localadmin';
    document.getElementById('adminPassword').value = '$6$rounds=4096$saltsalt$oPlsJhYAjdiMg2KV6rKZP7JMwLqOCPqKvdvgaLTdHh8Wl0C.YLN5HWJFPTjJKF9czcJvL8rEVKPc3VqJKvYFZ1';
    document.getElementById('disableLocal').checked = true;
    document.getElementById('tenantIdError').textContent = '';
    document.getElementById('clientIdError').textContent = '';
    outputSection.classList.add('hidden');
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  }
});
