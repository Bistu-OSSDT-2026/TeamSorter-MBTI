import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 主应用
import App from "./App.vue";
import router from "./router";
const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");

// 后台管理应用
import AdminApp from "./admin/AdminApp.vue";
import adminRouter from "./admin/router";
const adminApp = createApp(AdminApp);
adminApp.use(adminRouter);
adminApp.use(ElementPlus);
adminApp.mount("#admin");
