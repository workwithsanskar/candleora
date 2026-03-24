import { motion } from "framer-motion";

function Banner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-[#D4A24C]"
    >
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-center px-6 text-center lg:px-12">
        <p className="text-[14px] font-semibold uppercase tracking-[0.02em] text-black sm:text-[15px]">
          FREE DELIVERY WHEN YOU SPEND OVER RS.1999/-
        </p>
      </div>
    </motion.section>
  );
}

export default Banner;
