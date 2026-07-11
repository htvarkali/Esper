"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PawPrint, Trees, Satellite, Menu, X, Youtube, Instagram, ChevronDown } from "lucide-react"
import { AnimatedText } from "@/components/animated-text"
import { CustomDroneIcon } from "@/components/drone-icon"
import { WorldMap } from "@/components/world-map"
import { experiences } from "@/lib/experience-data"
import type { Experience } from "@/lib/experience-data"

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState("0")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const numericStr = value.replace(/[^0-9.]/g, "")
          const targetNum = Number.parseFloat(numericStr)
          const unit = value.replace(/[0-9.]/g, "")

          let current = 0
          const increment = targetNum / 60
          const interval = setInterval(() => {
            current += increment
            if (current >= targetNum) {
              setDisplayValue(`${targetNum}${unit}`)
              clearInterval(interval)
            } else {
              setDisplayValue(`${current.toFixed(1)}${unit}`.replace(".0", ""))
            }
          }, 16)

          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div className="text-8xl" ref={ref}>
      {displayValue}
    </div>
  )
}

export default function TerraPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [selectedFeature, setSelectedFeature] = useState(0)
  const [imageFade, setImageFade] = useState(true)
  const [autoRotationKey, setAutoRotationKey] = useState(0)
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0)
  const [wordFade, setWordFade] = useState(true)
  const [dashboardScrollOffset, setDashboardScrollOffset] = useState(0)
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>(null)

  const dynamicWords = ["forests", "nature", "animals", "ecosystems", "biodiversity", "wildlife", "habitats"]

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordFade(false)
      setTimeout(() => {
        setDynamicWordIndex((prev) => (prev + 1) % dynamicWords.length)
        setWordFade(true)
      }, 300)
    }, 3000)

    return () => clearInterval(wordInterval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)

      if (dashboardRef.current) {
        const dashboardRect = dashboardRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        const rotationStart = viewportHeight * 0.8
        const rotationEnd = viewportHeight * 0.2

        if (dashboardRect.top >= rotationStart) {
          setDashboardScrollOffset(0)
        } else if (dashboardRect.top <= rotationEnd) {
          setDashboardScrollOffset(15)
        } else {
          const scrollRange = rotationStart - rotationEnd
          const currentProgress = rotationStart - dashboardRect.top
          const rotationProgress = currentProgress / scrollRange
          const tiltAngle = rotationProgress * 15
          setDashboardScrollOffset(tiltAngle)
        }
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsLoaded(true)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const featuresCount = 4

    const interval = setInterval(() => {
      setImageFade(false)
      setTimeout(() => {
        setSelectedFeature((prev) => (prev + 1) % featuresCount)
        setImageFade(true)
      }, 300)
    }, 6000)

    return () => clearInterval(interval)
  }, [autoRotationKey])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-[#0B0C0F] text-[#F2F3F5] overflow-x-hidden">
      <header className="fixed top-6 left-6 md:w-auto md:right-auto right-6 z-40 border border-white/10 backdrop-blur-md bg-[#0B0C0F]/80 rounded-[16px]">
        <div className="w-full mx-auto px-6">
          <div className="flex items-center gap-6 md:h-14 h-14">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-lg md:text-xl font-semibold font-mono hover:text-pink-400 transition-colors duration-300"
            >
              TERRA
            </button>

            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("metrics")}
                className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
              >
                Impact
              </button>
              <button
                onClick={() => scrollToSection("map")}
                className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
              >
                Projects
              </button>
              <button
                onClick={() => scrollToSection("narrative")}
                className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
              >
                Technology
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("cta")}
                className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
              >
                Join us
              </button>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden ml-auto p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-[#0B0C0F]/95 backdrop-blur-md z-50 flex flex-col items-start justify-end pb-20 pt-20 px-6">
          <div className="flex flex-col gap-8 items-start text-left w-full">
            <button
              onClick={() => scrollToSection("metrics")}
              className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-pink-400 transition-colors duration-300"
            >
              Impact
            </button>
            <button
              onClick={() => scrollToSection("map")}
              className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-pink-400 transition-colors duration-300"
            >
              Projects
            </button>
            <button
              onClick={() => scrollToSection("narrative")}
              className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-pink-400 transition-colors duration-300"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-pink-400 transition-colors duration-300"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("cta")}
              className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-pink-400 transition-colors duration-300"
            >
              Join us
            </button>
          </div>
        </div>
      )}

      <section
        ref={heroRef}
        className={`relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isLoaded ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
        style={{
          backgroundImage: `url('/hero-landscape.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            backgroundImage: `url('/hero-landscape.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F]/70 to-transparent pointer-events-none" />

        <div
          className="max-w-[1120px] w-full mx-auto relative z-10"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        >
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-serif text-[44px] leading-[1.1] md:text-[72px] md:leading-[1.05] font-medium mb-6 text-balance">
              <span
                className={`block stagger-reveal text-7xl font-light transition-all duration-500 md:text-8xl ${
                  wordFade ? "opacity-100 blur-0" : "opacity-0 blur-lg"
                }`}
              >
                Protect <AnimatedText key={dynamicWordIndex} text={dynamicWords[dynamicWordIndex]} delay={0} />
              </span>
              <span className="block stagger-reveal text-7xl font-light md:text-8xl" style={{ animationDelay: "90ms" }}>
                at scale
              </span>
            </h1>
            <p
              className="text-[#A7ABB3] text-base md:text-lg max-w-[520px] mx-auto mb-8 leading-relaxed stagger-reveal text-white"
              style={{ animationDelay: "180ms" }}
            >
              Real-time forest monitoring with AI. Detect threats, track biodiversity, preserve nature for future
              generations.
            </p>
            <div className="stagger-reveal" style={{ animationDelay: "270ms" }}>
              <Button className="glass-button px-8 py-6 text-base rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white">
                Start Protecting
              </Button>
            </div>
          </div>

          <div className="mt-12 md:mt-20 stagger-reveal" style={{ animationDelay: "360ms" }} ref={dashboardRef}>
            <div style={{ perspective: "1200px" }}>
              <div
                className="relative aspect-[16/10] md:aspect-[16/9] rounded-[24px] overflow-hidden"
                style={{
                  transform: `rotateX(${dashboardScrollOffset}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.05s linear",
                }}
              >
                <img
                  src="/dashboard-screenshot.png"
                  alt="Acme Inc. Analytics Dashboard"
                  className="object-cover dashboard-image w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-12 border-y border-white/5 bg-[#0B0C0F] overflow-hidden md:py-8 md:pt-8 md:pb-4">
        <div className="w-full">
          <p className="text-center text-xs md:text-sm uppercase tracking-[0.2em] text-[#A7ABB3] mb-8">
            Trusted by leading conservation organizations
          </p>
          <div className="logo-marquee">
            <div className="logo-marquee-content">
              {[
                "/logos/frame-11.png",
                "/logos/frame-55.png",
                "/logos/frame-4.png",
                "/logos/frame-6.png",
                "/logos/frame-8.png",
                "/logos/frame-2.png",
                "/logos/frame-3.png",
                "/logos/frame-7.png",
                "/logos/frame-11.png",
                "/logos/frame-55.png",
                "/logos/frame-4.png",
                "/logos/frame-6.png",
                "/logos/frame-8.png",
                "/logos/frame-2.png",
                "/logos/frame-3.png",
                "/logos/frame-7.png",
              ].map((logo, i) => (
                <div key={i} className="px-8 md:px-12 flex items-center justify-center flex-shrink-0">
                  <img
                    src={logo || "/placeholder.svg"}
                    alt={`Partner logo ${i + 1}`}
                    className="h-32 md:h-24 w-auto object-contain opacity-60 hover:opacity-60 transition-all duration-300 brightness-0 invert"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="relative py-20 md:py-32 px-4 animate-on-scroll md:pt-24 md:pb-20">
        <div className="max-w-[1120px] w-full mx-auto">
          <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 md:mb-8 text-center text-balance">
            Conservation{" "}
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #d9a7c7 0%, #fffcdc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Impact
            </span>{" "}
            at Scale
          </h2>

          <p className="text-[#A7ABB3] text-sm md:text-base mb-12 md:mb-16 text-center max-w-[600px] mx-auto leading-relaxed">
            Trusted by conservation organizations worldwide. Powered by nature-first technology.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-[800px] mx-auto">
            {[
              { label: "FORESTS PROTECTED", value: "2.4M", desc: "hectares globally", color: "pink" },
              { label: "SPECIES MONITORED", value: "12K+", desc: "wildlife species", color: "purple" },
              { label: "CARBON SEQUESTERED", value: "18M", desc: "tons CO2", color: "pink" },
              { label: "THREAT DETECTION", value: "99.4%", desc: "accuracy rate", color: "purple" },
            ].map((metric, i) => (
              <div
                key={i}
                className="p-6 md:p-10 text-center border border-white/10 border-t-0 border-b border-l-0 border-r-0 md:py-10 md:pb-20"
              >
                <div
                  className={`text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-4 flex items-center justify-center gap-2`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${metric.color === "pink" ? "bg-pink-400/60" : "bg-purple-400/60"}`}
                  />
                  {metric.label}
                </div>
                <div className="font-serif text-[48px] md:text-[72px] leading-none font-medium">
                  <AnimatedCounter value={metric.value} />
                </div>
                <div className="text-[11px] md:text-xs text-[#A7ABB3] mt-3">{metric.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="map" className="relative py-20 md:py-32 animate-on-scroll bg-[#0B0C0F]">
        <div className="text-center mb-12 md:mb-16 px-4">
          <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            GLOBAL REACH
          </div>
          <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
            Conservation Projects Worldwide
          </h2>
          <p className="text-[#A7ABB3] text-sm md:text-base max-w-[600px] mx-auto leading-relaxed">
            Monitoring and protecting critical forest ecosystems across five continents
          </p>
        </div>

        <WorldMap
          experiences={experiences}
          selectedExperience={selectedExperience}
          onSelectExperience={setSelectedExperience}
        />
      </section>

      <section id="narrative" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-stretch">
            <div className="max-w-[720px]">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                CONSERVATION TECHNOLOGY
              </div>
              <h2 className="font-serif text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] font-medium mb-8 text-balance">
                Every forest ecosystem{" "}
                <span
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, #d9a7c7 0%, #fffcdc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  matters
                </span>
              </h2>
              <p className="text-[#A7ABB3] text-base md:text-lg leading-relaxed mb-12">
                Our satellite and AI technology monitors biodiversity, detects illegal logging, tracks deforestation
                patterns, and alerts teams in real-time. Preservation at the speed of nature demands.
              </p>

              <div className="md:hidden mb-8">
                <div className="rounded-[24px] p-1 w-full aspect-square overflow-hidden">
                  <img
                    src={
                      [
                        "/drone.png",
                        "/real-time-satellite.png",
                        "/biodiversity-tracking.png",
                        "/deforestation-detect.png",
                      ][selectedFeature] || "/placeholder.svg"
                    }
                    alt="Feature preview"
                    className={`w-full h-full object-cover rounded-[20px] transition-opacity duration-300 ${
                      imageFade ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    title: "Drone Surveys",
                    desc: "Aerial surveys to catalog wildlife and species diversity",
                    icon: CustomDroneIcon,
                    image: "/drone.png",
                  },
                  {
                    title: "Real-time Monitoring",
                    desc: "24/7 satellite surveillance with instant alerts",
                    icon: Satellite,
                    image: "/real-time-satellite.png",
                  },
                  {
                    title: "Biodiversity Tracking",
                    desc: "Map and monitor wildlife populations across regions",
                    icon: PawPrint,
                    image: "/biodiversity-tracking.png",
                  },
                  {
                    title: "Deforestation Prevention",
                    desc: "Detect threats before they escalate",
                    icon: Trees,
                    image: "/deforestation-detect.png",
                  },
                ].map((feature, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImageFade(false)
                      setTimeout(() => {
                        setSelectedFeature(i)
                        setImageFade(true)
                        setAutoRotationKey((prev) => prev + 1)
                      }, 300)
                    }}
                    className={`relative w-full text-left flex gap-4 items-start p-5 transition-all duration-300 rounded-xs py-4 overflow-hidden ${
                      selectedFeature === i ? "border border-white/20" : "border border-white/10"
                    }`}
                  >
                    <feature.icon
                      className={`w-6 h-6 flex-shrink-0 mt-1 transition-colors ${
                        selectedFeature === i ? "text-green-400" : "text-green-500/60"
                      }`}
                    />
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm md:text-base text-[#A7ABB3]">{feature.desc}</p>
                    </div>
                    {selectedFeature === i && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                        <div className="h-full bg-white progress-bar" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-stretch justify-center">
              <div className="relative w-full h-full min-h-[500px]">
                {[
                  {
                    title: "Drone Surveys",
                    image: "/drone.png",
                  },
                  {
                    title: "Real-time Monitoring",
                    image: "/real-time-satellite.png",
                  },
                  {
                    title: "Biodiversity Tracking",
                    image: "/biodiversity-tracking.png",
                  },
                  {
                    title: "Deforestation Prevention",
                    image: "/deforestation-detect.png",
                  },
                ].map((feature, i) => {
                  const positionInStack = (i - selectedFeature + 4) % 4
                  const isActive = positionInStack === 0

                  return (
                    <div
                      key={i}
                      className="absolute inset-0 p-1 transition-all duration-600 ease-out"
                      style={{
                        zIndex: 4 - positionInStack,
                        transform: `translateX(${positionInStack * 16}px) scale(${1 - positionInStack * 0.02})`,
                        opacity: isActive ? (imageFade ? 1 : 1) : 0.6 - positionInStack * 0.15,
                      }}
                    >
                      <img
                        src={feature.image || "/placeholder.svg"}
                        alt={feature.title}
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Got{" "}
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, #d9a7c7 0%, #fffcdc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                questions
              </span>
              ?
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[600px] mx-auto leading-relaxed">
              Everything you need to know about TERRA and our conservation technology platform.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does TERRA's satellite monitoring work?",
                answer:
                  "Our platform uses a network of satellites combined with AI algorithms to analyze forest coverage in real-time. We detect changes as small as 0.5 hectares within 24 hours, allowing for rapid response to threats like illegal logging or forest fires.",
              },
              {
                question: "What regions does TERRA currently cover?",
                answer:
                  "TERRA currently monitors over 2.4 million hectares across five continents, including the Amazon rainforest, Congo Basin, Borneo, Russian Taiga, and Pacific Northwest. We're continuously expanding our coverage to protect more critical ecosystems.",
              },
              {
                question: "How accurate is the threat detection system?",
                answer:
                  "Our AI-powered threat detection achieves a 99.4% accuracy rate. We use machine learning models trained on millions of satellite images to distinguish between natural changes and human-caused deforestation or illegal activities.",
              },
              {
                question: "Can organizations integrate TERRA with their existing systems?",
                answer:
                  "Yes, TERRA offers a comprehensive API that allows seamless integration with existing conservation management systems, GIS platforms, and alert systems. Our documentation provides detailed guides for implementation.",
              },
              {
                question: "What is the pricing model for TERRA?",
                answer:
                  "We offer tiered pricing based on coverage area and feature requirements. Non-profit conservation organizations may qualify for discounted rates or grants. Contact our team for a customized quote based on your needs.",
              },
              {
                question: "How can I contribute to forest conservation through TERRA?",
                answer:
                  "There are several ways to contribute: donate to support monitoring of unprotected regions, volunteer for on-ground verification teams, or partner with us as a corporate sponsor. Every contribution helps protect critical ecosystems.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[#A7ABB3] transition-transform duration-300 ${
                      openFaqIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-6 text-sm md:text-base text-[#A7ABB3] leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative py-24 md:py-40 px-4 animate-on-scroll overflow-hidden pt-0"
        style={{
          backgroundImage: `url('/earth-cta.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0F] via-[#0B0C0F]/60 to-transparent pointer-events-none" />
        <div className="max-w-[800px] w-full mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 rounded-full mb-8 text-xs md:text-sm text-[#A7ABB3]">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            Save the world
          </div>

          <h2 className="font-serif text-[40px] leading-[1.15] md:text-[64px] md:leading-[1.1] font-medium mb-6 text-balance">
            Join the global conservation movement
          </h2>
          <p className="text-[#A7ABB3] text-base md:text-lg mb-10 leading-relaxed max-w-[560px] mx-auto">
            Together, we're building a sustainable future. Start protecting forests today.
          </p>

          <Button className="glass-button text-base rounded-full bg-white/5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-white px-8 py-6 md:text-base">
            Get Started Today
          </Button>
        </div>
      </section>

      <footer className="relative px-4 border-t border-white/5 py-8">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            {/* Brand Column */}
            <div className="flex flex-col gap-4">
              <div className="text-lg font-semibold font-mono">TERRA</div>
              <p className="text-xs text-[#A7ABB3] leading-relaxed">
                Protecting global forests through real-time monitoring and AI technology.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Menu */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Product</div>
              <div className="flex flex-col gap-3">
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Features
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Pricing
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Documentation
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  API
                </a>
              </div>
            </div>

            {/* Company Menu */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Company</div>
              <div className="flex flex-col gap-3">
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  About
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Blog
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Careers
                </a>
                <a href="#" className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors">
                  Contact
                </a>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Newsletter</div>
              <p className="text-xs text-[#A7ABB3] mb-3">Get updates on forest conservation insights.</p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-[#F2F3F5] placeholder-[#A7ABB3] focus:outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 transition-all"
                />
                <button className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-pink-500/30 hover:border-pink-500/50 transition-all bg-green-800 border-green-700 text-white">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#A7ABB3]">
            <div>© 2025 TERRA. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#F2F3F5] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#F2F3F5] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#F2F3F5] transition-colors">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
