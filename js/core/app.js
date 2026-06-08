import { APP_VERSION } from "./constants.js";
import { state } from "./state.js";
import { createHashRouter } from "./router.js";

const router = createHashRouter();

export async function bootstrap() {
  state.appVersion = APP_VERSION;
  state.router = router;

  await import("./legacy-app.js");
}

bootstrap();
