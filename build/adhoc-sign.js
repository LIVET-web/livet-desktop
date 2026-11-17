// Firma "ad-hoc" la app de Mac después de armarla. Sin una firma válida, macOS (sobre todo en
// chips Apple) dice que la app "está dañada". Esto no reemplaza la firma de Apple Developer.
const { execSync } = require("child_process");
const path = require("path");
exports.default = async (ctx) => {
  if (ctx.electronPlatformName !== "darwin") return;
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  execSync(`codesign --force --deep --sign - "${app}"`, { stdio: "inherit" });
  execSync(`codesign --verify --deep --strict "${app}"`, { stdio: "inherit" });
};
