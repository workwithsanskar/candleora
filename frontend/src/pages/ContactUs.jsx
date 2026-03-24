function ContactUs() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white">
      <section className="container-shell py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-candle">
          <div className="bg-black px-6 py-6 sm:px-8 lg:px-12">
            <h1 className="font-display text-heading-md font-semibold text-white">
              Get In Touch With Us
            </h1>
          </div>

          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-12 lg:px-10 lg:py-12">
            <div className="space-y-10 lg:space-y-12">
              <div className="border-b border-black/10 pb-9">
                <p className="text-base font-medium text-black">Phone Number</p>
                <p className="mt-2 text-base leading-8 text-black/68">8999908639</p>
              </div>

              <div className="border-b border-black/10 pb-9">
                <p className="text-base font-medium text-black">Email Address</p>
                <p className="mt-2 text-base leading-8 text-black/68">candleora25@gmail.com</p>
              </div>

              <div>
                <p className="text-base font-medium text-black">Location</p>
                <p className="mt-2 max-w-[360px] text-base leading-8 text-black/68">
                  Online Store
                </p>
              </div>
            </div>

            <div>
              <div className="max-w-[620px]">
                <h2 className="font-display text-heading-md font-semibold text-black">
                  Send us a message
                </h2>
                <p className="mt-3 max-w-[620px] text-sm leading-7 text-black/62">
                  Have a question about an order, gifting, custom candles, or bulk enquiries? Send us a message and our team will get back to you shortly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="input-pill"
                  />
                  <input
                    type="email"
                    placeholder="Your E-mail"
                    className="input-pill"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="input-pill"
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    className="input-pill"
                  />
                </div>

                <textarea
                  rows="6"
                  placeholder="Message"
                  className="min-h-[160px] w-full rounded-[24px] border border-black/15 px-5 py-4 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black"
                />

                <button type="submit" className="btn btn-primary">
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
