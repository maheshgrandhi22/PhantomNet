import pathlib, re

path = pathlib.Path('/root/phantomnet/filesystem.py')
code = path.read_text()

new_getattr = '''    def getattr(self, path, fh=None):
        if path not in self.files:
            import stat, time, os
            NOW = time.time()
            
            # 1. Register parent directories dynamically
            parts = path.strip('/').split('/')
            current = ''
            for part in parts[:-1]:
                current += '/' + part
                if current not in self.files:
                    self.files[current] = dict(st_mode=(stat.S_IFDIR | 0o755), st_nlink=2, st_atime=NOW, st_mtime=NOW, st_ctime=NOW)
            
            # 2. Register the target file or directory
            clean_name = os.path.basename(path)
            if '.' in clean_name and not clean_name.startswith('.'):
                self.files[path] = dict(st_mode=(stat.S_IFREG | 0o644), st_nlink=1, st_size=4096, st_atime=NOW, st_mtime=NOW, st_ctime=NOW)
            else:
                self.files[path] = dict(st_mode=(stat.S_IFDIR | 0o755), st_nlink=2, st_atime=NOW, st_mtime=NOW, st_ctime=NOW)
        
        return self.files[path]'''

# Replace the getattr method block safely
code = re.sub(r'    def getattr\(self, path, fh=None\):.*?(?=    def [a-z])', new_getattr + '\n\n', code, flags=re.DOTALL)
path.write_text(code)
print("[+] FUSE deep-path logic updated successfully!")
