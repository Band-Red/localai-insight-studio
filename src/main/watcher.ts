import chokidar from 'chokidar';

export class FileWatcher {
    public watchDirectory(dirPath: string, callback: (path: string) => void) {
        const watcher = chokidar.watch(dirPath, {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });

        watcher.on('change', (path) => {
            console.log(`File ${path} has been changed`);
            callback(path);
        });
    }
}