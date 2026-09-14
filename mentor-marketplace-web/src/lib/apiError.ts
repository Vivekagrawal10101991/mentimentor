function messageFromPayload(data: unknown): string | null {
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }
  if (typeof data === "object" && data !== null) {
    if ("message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
    if ("error" in data) {
      const err = (data as { error?: unknown }).error;
      if (typeof err === "object" && err !== null && "message" in err) {
        const message = (err as { message?: unknown }).message;
        if (typeof message === "string" && message.trim().length > 0) {
          return message;
        }
      }
    }
  }
  return null;
}

export function normalizeApiError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    const msg = messageFromPayload(data);
    if (msg) {
      return msg;
    }
  }
  return "Something went wrong. Please try again.";
}
