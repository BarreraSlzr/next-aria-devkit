type NextConfigLike = Record<string, unknown> & {
  transpilePackages?: string[];
  instrumentationClientInject?: string[];
  env?: Record<string, string | undefined>;
};

export interface NextAriaDevkitPluginOptions {
  bridgeUrl?: string;
  inject?: boolean;
  packageName?: string;
  fmBaseUrl?: string;
}

const PKG_ALIASES = ["next-aria-devkit", "@internetfriends/next-aria-devkit"];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function withNextAriaDevkit<T extends NextConfigLike>(
  nextConfig: T = {} as T,
  options: NextAriaDevkitPluginOptions = {},
): T {
  const inject = options.inject !== false;
  const pkg = options.packageName ?? "@internetfriends/next-aria-devkit";
  const existingInject = Array.isArray(nextConfig.instrumentationClientInject)
    ? nextConfig.instrumentationClientInject
    : [];

  return {
    ...nextConfig,
    transpilePackages: unique([...(nextConfig.transpilePackages ?? []), ...PKG_ALIASES]),
    env: {
      ...(nextConfig.env ?? {}),
      NEXT_PUBLIC_NADK_BRIDGE_URL: options.bridgeUrl ?? nextConfig.env?.NEXT_PUBLIC_NADK_BRIDGE_URL ?? "",
      NADK_FM_BASE_URL: options.fmBaseUrl ?? nextConfig.env?.NADK_FM_BASE_URL ?? "http://127.0.0.1:1976",
    },
    ...(inject
      ? { instrumentationClientInject: unique([...existingInject, `${pkg}/inject`]) }
      : {}),
  };
}

export default withNextAriaDevkit;
