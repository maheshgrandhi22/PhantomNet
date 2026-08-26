class LoreGenerator:
    def __init__(self):
        # Dictionary of fake decoy payloads simulating a compromised system
        self.decoys = {
            "/root/.env": "DB_HOST=localhost\nDB_USER=admin\nDB_PASS=SecretPass123!\nJWT_SECRET=super_secret_jwt_token_9981\nSTRIPE_API_KEY=sk_live_fakekey987654321\n",
            "/root/.aws/credentials": "[default]\naws_access_key_id = AKIAIOSFODNN7EXAMPLE\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n",
            "/root/.aws/config": "[default]\nregion = us-east-1\noutput = json\n",
            "/root/.ssh/id_rsa": "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAYEA0vFakeKeyDataForHoneypotTestingPurposesOnlyXYZ==\n-----END OPENSSH PRIVATE KEY-----\n",
            "/root/.ssh/authorized_keys": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFakeAuthorizedKeyForHoneypotTestingOnly attacker@phantom\n",
            "/var/www/html/config.php": r"""<?php
$servername = "localhost";
$username = "root";
$password = "RootDbPass2026!";
$dbname = "production_db";
?>
""",
            "/var/www/html/index.php": "<?php\necho \"Welcome to PhantomNet Production Portal\";\n?>\n",
            "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n",
            "/etc/shadow": r"root:$6$rounds=5000$fakesalt$encryptedhashstringhere:19000:0:99999:7:::\n"
        }

    def get_content(self, path):
        norm_path = path.strip()
        return self.decoys.get(norm_path, None)
