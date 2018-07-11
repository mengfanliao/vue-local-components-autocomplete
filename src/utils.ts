
function matchType(obj: any, type: string) {
    return Object.prototype.toString.call(obj) === type;
}
export default {
    toKebabCase(str: string) {
        if (!str) {
            return '';
        } else {
            return str.replace(/[A-Z]/g, function(ch, index) {
                return (index === 0 ? '' : '-') + ch.toLowerCase();
            })
        }
    },
    isObject(obj: any) {
        return matchType(obj, '[object Object]');
    },
    isArray(obj: any) {
        return matchType(obj, '[object Array]');
    }
};