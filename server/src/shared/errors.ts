export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const unauthorized = () => new AppError(401, 'UNAUTHENTICATED', 'Please sign in again.');
