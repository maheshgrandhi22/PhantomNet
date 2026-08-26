import os
import stat
import errno
import time
import threading
import requests
from fuse import FUSE, FuseOSError, Operations
from lore import generate_honeypot_file

class PhantomFS(Operations):
    def __init__(self):
        self.cache = {}
        self.files = {}
        now = time.time()
        
        self.files['/'] = dict(
            st_mode=(stat.S_IFDIR | 0o755),
            st_ctime=now, st_mtime=now, st_atime=now, st_nlink=2
        )

        file_paths = [
            '/root/.env',
            '/root/.aws/credentials',
            '/root/.ssh/id_rsa',
            '/var/www/html/config.php',
            '/var/log/syslog',
            '/etc/passwd',
            '/etc/shadow',
            '/etc/hosts'
        ]
        
        def add_parents(p):
            parent = self._parent_dir(p)
            if parent and parent not in self.files:
                add_parents(parent)
                self.files[parent] = dict(
                    st_mode=(stat.S_IFDIR | 0o755),
                    st_ctime=now, st_mtime=now, st_atime=now, st_nlink=2
                )

        for f in file_paths:
            f_norm = self._norm(f)
            add_parents(f_norm)
            
            content = generate_honeypot_file(f_norm)
            self.cache[f_norm] = content
            exact_size = len(content.encode('utf-8'))

            self.files[f_norm] = dict(
                st_mode=(stat.S_IFREG | 0o644),
                st_ctime=now, st_mtime=now, st_atime=now, st_nlink=1,
                st_size=exact_size
            )

    def _norm(self, path):
        if not path.startswith('/'):
            path = '/' + path
        if len(path) > 1 and path.endswith('/'):
            path = path.rstrip('/')
        return path

    def _parent_dir(self, path):
        path = self._norm(path)
        if path == '/':
            return None
        parent = os.path.dirname(path)
        return '/' if parent == '' else parent

    def _async_log(self, event_type, details):
        def send_event():
            try:
                requests.post("http://localhost:5000/api/event", json={
                    "event_type": event_type,
                    "details": details
                }, timeout=1)
            except Exception:
                pass
        threading.Thread(target=send_event, daemon=True).start()

    def getattr(self, path, fh=None):
        path = self._norm(path)
        if path not in self.files:
            raise FuseOSError(errno.ENOENT)
        st = dict(self.files[path])
        if path in self.cache:
            st['st_size'] = len(self.cache[path].encode('utf-8'))
        return st

    def readdir(self, path, fh):
        path = self._norm(path)
        entries = ['.', '..']
        for f in self.files:
            if f != path and self._parent_dir(f) == path:
                entries.append(os.path.basename(f))
        return entries

    def open(self, path, flags):
        path = self._norm(path)
        if path not in self.files:
            raise FuseOSError(errno.ENOENT)
        
        accmode = flags & os.O_ACCMODE
        if accmode in (os.O_WRONLY, os.O_RDWR):
            self._async_log("FILE_OPEN_WRITE", f"FILE OPENED FOR WRITE: Path='{path}' Flags={flags}")
        elif flags & os.O_TRUNC:
            self._async_log("FILE_TRUNCATE", f"FILE TRUNCATED ON OPEN: Path='{path}'")
        return 0

    def read(self, path, size, offset, fh):
        path = self._norm(path)
        if path not in self.files:
            raise FuseOSError(errno.ENOENT)

        if path not in self.cache:
            self.cache[path] = generate_honeypot_file(path)

        if offset == 0:
            self._async_log("FILE_READ", f"FILE READ ATTEMPT: Path='{path}'")

        data = self.cache[path].encode('utf-8')
        return data[offset:offset + size]

    def write(self, path, data, offset, fh):
        path = self._norm(path)
        if path not in self.files:
            raise FuseOSError(errno.ENOENT)

        if path not in self.cache:
            self.cache[path] = generate_honeypot_file(path)

        content_bytes = bytearray(self.cache[path].encode('utf-8'))
        
        if offset + len(data) > len(content_bytes):
            content_bytes.extend(b'\x00' * (offset + len(data) - len(content_bytes)))
            
        content_bytes[offset:offset + len(data)] = data
        updated_content = content_bytes.decode('utf-8', errors='ignore')
        
        self.cache[path] = updated_content
        new_size = len(content_bytes)

        self.files[path]['st_size'] = new_size
        self.files[path]['st_mtime'] = time.time()

        written_preview = data[:30].decode('utf-8', errors='ignore').replace('\n', '\\n')
        self._async_log("FILE_WRITE", f"FILE MODIFIED: Path='{path}' Offset={offset} Bytes={len(data)} Data='{written_preview}'")

        return len(data)

    def truncate(self, path, length, fh=None):
        path = self._norm(path)
        if path not in self.files:
            raise FuseOSError(errno.ENOENT)
        
        if path not in self.cache:
            self.cache[path] = generate_honeypot_file(path)

        content_bytes = bytearray(self.cache[path].encode('utf-8'))[:length]
        self.cache[path] = content_bytes.decode('utf-8', errors='ignore')
        self.files[path]['st_size'] = length
        self.files[path]['st_mtime'] = time.time()

        self._async_log("FILE_TRUNCATE", f"FILE TRUNCATED: Path='{path}' NewSize={length}")
        return 0

    def create(self, path, mode, fi=None):
        path = self._norm(path)
        now = time.time()
        parent = self._parent_dir(path)
        if parent not in self.files:
            raise FuseOSError(errno.ENOENT)

        self.files[path] = dict(
            st_mode=(stat.S_IFREG | mode),
            st_ctime=now, st_mtime=now, st_atime=now, st_nlink=1, st_size=0
        )
        self.cache[path] = ""
        self._async_log("FILE_CREATE", f"NEW FILE CREATED: Path='{path}' Mode={oct(mode)}")
        return 0

if __name__ == '__main__':
    mount_point = '/tmp/phantom_mount'
    os.makedirs(mount_point, exist_ok=True)
    FUSE(PhantomFS(), mount_point, foreground=True, allow_other=True, nonempty=True)
