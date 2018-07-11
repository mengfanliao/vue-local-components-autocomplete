
import {workspace} from 'vscode';
const config = workspace.getConfiguration('local-component');
const data: Config = {
    quote: config.get('quotes') === 'double' ? '"' : '\'',
    indentSize: config.get('indent-size') || 2,
    dir: config.get('dir') || 'src',
    extHiddingList: config.get('extHiddingList') || ['.js']
};
export default data;