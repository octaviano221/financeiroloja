import jwt from "jsonwebtoken";

export function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token nao informado." });
    }

    try {
      const token = header.replace("Bearer ", "");
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;

      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ message: "Permissao insuficiente." });
      }

      return next();
    } catch {
      return res.status(401).json({ message: "Token invalido." });
    }
  };
}
