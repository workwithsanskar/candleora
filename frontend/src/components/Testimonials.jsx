import PropTypes from "prop-types";
import { motion } from "framer-motion";

function Testimonials({ stories }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {stories.map((story, index) => (
        <motion.article
          key={`${story.name}-${index}`}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.42, delay: index * 0.08, ease: "easeOut" }}
          className="rounded-[18px] border border-[#E7BB66] bg-white p-4 shadow-[0_6px_14px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-[18px] w-[18px] shrink-0 rounded-full bg-black" />
            <div className="space-y-2">
              <p className="text-[13px] leading-none text-black/78">
                <span className="font-medium text-black">{story.name}</span>
                <span className="mx-2 text-black/45">•</span>
                <span>{story.date}</span>
              </p>
              <p className="max-w-[330px] text-[14px] leading-[1.45] text-black/68">
                {story.quote}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-[2px] text-[#F6BC29]">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <svg key={starIndex} viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-current" aria-hidden="true">
                <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
              </svg>
            ))}
          </div>
        </motion.article>
      ))}
    </div>
  );
}

Testimonials.propTypes = {
  stories: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      quote: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default Testimonials;
