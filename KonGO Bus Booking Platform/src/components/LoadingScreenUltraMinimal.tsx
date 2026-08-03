import { motion } from "motion/react";

export function LoadingScreenUltraMinimal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-surface-primary z-50 flex items-center justify-center"
    >
      {/* Simple spinner avec les couleurs KonGO */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-10 h-10 border-3 border-gray-200 border-t-kongo-lime rounded-full"
      />
    </motion.div>
  );
}
