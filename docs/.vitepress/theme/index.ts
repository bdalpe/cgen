import DefaultTheme from "vitepress/theme";
import TokenList from "./components/TokenList.vue";

export default {
  ...DefaultTheme,
	enhanceApp({app}) {
	  app.component("TokenList", TokenList);
	}
};
