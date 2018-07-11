export default [
    {
        statement: "import utils from 'modules/utils",
        result: true
    }, {
        statement: "import { commonTypes } from '../common/vuex-type",
        result: false
    }, {
        statement: "import Element from 'element-ui",
        result: true
    }, {
        statement: "import userInfo from './components",
        result: false
    }, {
        statement: "import '@hfe/paprika",
        result: false
    }, {
        statement: "import GloablComponents from 'components/index",
        result: true
    },
    ,
    
];