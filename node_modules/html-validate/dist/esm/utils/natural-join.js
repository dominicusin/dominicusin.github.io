function naturalJoin(values, conjunction = "or") {
  switch (values.length) {
    case 0:
      return "";
    case 1:
      return values[0];
    case 2:
      return `${values[0]} ${conjunction} ${values[1]}`;
    default:
      return `${values.slice(0, -1).join(", ")} ${conjunction} ${values.at(-1)}`;
  }
}

export { naturalJoin as n };
//# sourceMappingURL=natural-join.js.map
