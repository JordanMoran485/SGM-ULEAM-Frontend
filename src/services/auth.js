function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export function extractAuthPayload(result) {
  const token = firstDefined(
    result?.token,
    result?.access_token,
    result?.plainTextToken,
    result?.data?.token,
    result?.data?.access_token,
    result?.data?.plainTextToken
  );

  const user = firstDefined(
    result?.user,
    result?.data?.user,
    result?.data
  );

  return { user, token };
}
