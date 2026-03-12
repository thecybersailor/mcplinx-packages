import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * 从 connector 项目中获取 package name
 * 优先级: package.json name > 目录名
 * 返回原始的 package.json.name（用于发布标准），只去掉 @ 前缀（保留 / 作为路径分隔符）
 */
export function getPackageName(cwd: string): string {
    // 尝试读取 package.json
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            if (pkg.name) {
                // 返回 package.json.name，只去掉 @ 前缀（保留 / 作为路径分隔符）
                // @myorg/connector-name -> myorg/connector-name
                return pkg.name.replace(/^@/, '');
            }
        } catch (e) {
            // ignore json parse error
        }
    }

    // 退回到目录名
    const dirName = cwd.split('/').pop() || 'dev';
    return dirName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
