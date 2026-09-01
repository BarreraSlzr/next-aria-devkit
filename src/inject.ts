function boot() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  const start = () => {
    import("./mount").then(({ mountDevKit }) => mountDevKit()).catch((error) => {
      console.warn("[next-aria-devkit] failed to mount", error);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

boot();
