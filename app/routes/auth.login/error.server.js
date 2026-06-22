export function loginErrorMessage(loginErrors) {
  if (loginErrors?.shop === "MISSING_SHOP") {
    return { shop: "Please enter your shop domain to log in" };
  } else if (loginErrors?.shop === "INVALID_SHOP") {
    return { shop: "Please enter a valid shop domain to log in" };
  }

  return {};
}
