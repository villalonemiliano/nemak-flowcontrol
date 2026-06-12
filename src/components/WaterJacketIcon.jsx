import { motion } from "framer-motion";

const WATER_JACKET_IMAGE = "https://media.base44.com/images/public/6a25d4acd913cf2dc74e56fc/5e2401881_image.png";

export default function WaterJacketIcon({ size = 24, animated = true }) {
  const Component = (
    <img
      src={WATER_JACKET_IMAGE}
      alt="Liquid Jacket"
      style={{
        width: size,
        height: size * 0.65,
        objectFit: "contain",
        objectPosition: "center",
      }}
    />
  );

  if (!animated) return Component;

  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {Component}
    </motion.div>
  );
}