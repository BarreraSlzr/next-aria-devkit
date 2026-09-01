type NextConfigLike = Record<string, unknown> & {
  transpilePackages?: string[];
  instrumentationClientInject?: string[];
  env?: Record<string, string | undefined>;
};

export interface NextAriaDevkitPluginOptions {
  bridgeUrl?: string;
  inject?: boolean;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function withNextAriaDevkit<T extends NextConfigLike>(
  nextConfig: T = {} as T,
  options: NextAriaDevkitPluginOptions = {},
): T {
  const inject = options.inject !== false;
  const existingInject = Array.isArray(nextConfig.instrumentationClientInject)
    ? nextConfig.instrumentationClientInject
    : [];

  return {
    ...nextConfig,
    transpilePackages: unique([...(nextConfig.transpilePackages ?? []), "next-aria-devkit"]),
    env: {
      ...(nextConfig.env ?? {}),
      NEXT_PUBLIC_NADK_BRIDGE_URL: options.bridgeUrl ?? nextConfig.env?.NEXT_PUBLIC_NADK_BRIDGE_URL ?? "",
    },
    ...(inject
      ? {
          instrumentationClientInject: unique([...existingInject, "next-aria-devkit/inject"]),
        }
      : {}),
  };
}

export default withNextAriaDevkit;
