import GlobeContainer from "../components/GlobeContainer";
import {
  TotalRequests,
  TopCountries,
  RegionCount,
  StatsGrid,
  StatusLegend,
} from "../components/StatsDisplay";
import CheckinCodesPanel from "../components/CheckinCodesPanel";
import CodeBadge from "../components/CodeBadge";
import AuthGuard from "@/components/auth-guard";

const panelClass =
  "bg-gray-alpha-100 backdrop-blur-md border border-gray-alpha-200 rounded-md p-4";

function Header() {
  return (
    <>
      <p className="text-gray-1000 font-mono my-0 whitespace-nowrap">
        Esper — Global Patient Monitor{" "}
        <span className="flex items-center gap-2 font-mono text-gray-900">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live - click a patient dot
        </span>
      </p>
      <StatusLegend />
      <div className="flex items-center gap-3">
        <CodeBadge />
        <a
          href="http://localhost:3001/dashboard"
          className="text-gray-1000 text-xs uppercase hover:underline underline-offset-2"
        >
          Command Center ↗
        </a>
      </div>
    </>
  );
}

export default function GlobePage() {
  return (
    <AuthGuard>
      <div className="fixed inset-0 -z-10 bg-black" aria-hidden>
        <video
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60 pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <main className="font-mono min-h-screen max-w-[min(100vw,1600px)] mx-auto relative flex flex-col md:block px-6 pt-12 md:pt-16">
        <div className="w-full max-w-[1600px] space-y-1.5 mx-auto mt-1 mb-12">
          <div className="flex flex-col min-[961px]:hidden">
            <header
              className={`flex flex-col items-start font-mono text-sm uppercase gap-3 mb-6 w-fit ${panelClass}`}
            >
              <Header />
            </header>

            <section className={`pb-6 w-full mb-6 ${panelClass}`}>
              <div className="flex flex-col gap-y-6">
                <TotalRequests />
                <TopCountries />
              </div>
              <RegionCount />
            </section>

            <div className="w-full flex justify-center">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-black/60 blur-3xl scale-110"
                  aria-hidden
                />
                <GlobeContainer />
              </div>
            </div>
          </div>

          <div className="relative hidden min-[961px]:flex flex-row max-lg:items-end lg:items-center lg:justify-between">
            <header
              className={`absolute top-0 left-0 flex flex-col items-start font-mono text-sm xl:text-base uppercase gap-3 z-10 ${panelClass}`}
            >
              <Header />
            </header>

            <section className={`lg:absolute lg:bottom-0 w-fit z-10 relative mt-56 ${panelClass}`}>
              <div className="flex flex-col gap-y-8">
                <TotalRequests />
                <TopCountries />
              </div>
              <RegionCount />
            </section>

            <div className="w-full flex justify-end lg:pr-12">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-black/60 blur-3xl scale-110"
                  aria-hidden
                />
                <GlobeContainer />
              </div>
            </div>
          </div>

          <section className="mt-8">
            <StatsGrid />
          </section>

          <section className="mt-8">
            <CheckinCodesPanel />
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
