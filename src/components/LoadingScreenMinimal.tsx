import { motion } from "motion/react";

export function LoadingScreenMinimal() {
  return (
    <div className="fixed inset-0 bg-surface-primary z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Logo simple */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.4,
            ease: "easeOut"
          }}
          className="mb-6"
        >
          <div className="w-16 h-16 bg-kongo-black rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-on-black font-bold text-2xl">K</span>
          </div>
          <h1 className="text-h3 text-kongo-black font-bold">KonGO</h1>
        </motion.div>

        {/* Indicateur simple */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-kongo-lime rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}