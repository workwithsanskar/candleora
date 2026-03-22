function ContactUs() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white">
      <section className="container-shell py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[8px] border border-[#dddddd] bg-white">
          <div className="bg-black px-6 py-6 sm:px-8 lg:px-12">
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.2rem]">
              Get In Touch With Us
            </h1>
          </div>

          <div className="grid gap-12 px-6 py-10 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14 lg:px-10 lg:py-12">
            <div className="space-y-10 lg:space-y-12">
              <div className="border-b border-[#e3e3e3] pb-9">
                <p className="text-[1rem] font-medium text-brand-dark">Phone Number</p>
                <p className="mt-2 text-[1rem] leading-8 text-brand-dark/68">0012334566</p>
              </div>

              <div className="border-b border-[#e3e3e3] pb-9">
                <p className="text-[1rem] font-medium text-brand-dark">Email Address</p>
                <p className="mt-2 text-[1rem] leading-8 text-brand-dark/68">johndoe@example.com</p>
              </div>

              <div>
                <p className="text-[1rem] font-medium text-brand-dark">Location</p>
                <p className="mt-2 max-w-[360px] text-[1rem] leading-8 text-brand-dark/68">
                  CandleOra Studio, Heritage Lane, Jaipur, Rajasthan 302001, India
                </p>
              </div>
            </div>

            <div>
              <div className="max-w-[620px]">
                <h2 className="text-[2rem] font-medium tracking-[-0.03em] text-brand-dark">
                  Send us a message
                </h2>
                <p className="mt-3 max-w-[620px] text-[1rem] leading-8 text-brand-dark/62">
                  Have a question about an order, gifting, custom candles, or bulk enquiries? Send
                  us a message and our team will get back to you shortly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="h-[54px] rounded-full border border-[#d8d8d8] px-5 text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-dark"
                  />
                  <input
                    type="email"
                    placeholder="Your E-mail"
                    className="h-[54px] rounded-full border border-[#d8d8d8] px-5 text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-dark"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="h-[54px] rounded-full border border-[#d8d8d8] px-5 text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-dark"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    className="h-[54px] rounded-full border border-[#d8d8d8] px-5 text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-dark"
                  />
                </div>

                <textarea
                  rows="6"
                  placeholder="Message"
                  className="min-h-[160px] w-full rounded-[24px] border border-[#d8d8d8] px-5 py-4 text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-dark"
                />

                <button
                  type="submit"
                  className="inline-flex rounded-full bg-[#2a2a2a] px-7 py-4 text-[1rem] font-semibold text-white transition hover:bg-black"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
