export function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}
