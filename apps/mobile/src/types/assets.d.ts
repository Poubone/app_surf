declare module '*.db' {
  const assetId: number;
  export default assetId;
}

declare module '*.json' {
  const value: unknown;
  export default value;
}
