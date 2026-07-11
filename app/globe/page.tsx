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

export default function GlobePage() {
  return (
    <AuthGuard>
      <main className="font-mono min-h-screen max-w-[min(100vw,1600px)] mx-auto relative overflow-hidden md:rounded-md flex flex-col md:block px-6 pt-12 md:pt-16">
        <div className="w-full max-w-[1600px] space-y-1.5 mx-auto mt-1 mb-12">
          <div className="flex flex-col min-[961px]:hidden">
            <header className="flex flex-col items-start font-mono text-sm uppercase gap-2 mb-6">
              <p className="text-gray-1000 font-mono my-0 whitespace-nowrap">
                Esper — Global Patient Monitor{" "}
                <span className="block font-mono text-gray-900">
                  [Live - click a patient dot]
                </span>
              </p>
              <StatusLegend />
              <a
                href="http://localhost:3001/dashboard"
                className="text-gray-1000 text-xs uppercase hover:underline underline-offset-2"
              >
                Command Center ↗
              </a>
              <CodeBadge />
            </header>

            <section className="pb-6 w-full">
              <div className="flex flex-col gap-y-6">
                <TotalRequests />
                <TopCountries />
              </div>
              <RegionCount />
            </section>

            <div className="w-full flex justify-center">
              <GlobeContainer />
            </div>
          </div>

          <div className="relative hidden min-[961px]:flex flex-row max-lg:items-end lg:items-center lg:justify-between">
            <header className="absolute top-0 left-0 flex flex-col items-start font-mono text-sm xl:text-base uppercase gap-2 z-10">
              <p className="text-gray-1000 font-mono my-0 whitespace-nowrap">
                Esper — Global Patient Monitor{" "}
                <span className="block font-mono text-gray-900">
                  [Live - click a patient dot]
                </span>
              </p>
              <StatusLegend />
              <a
                href="http://localhost:3001/dashboard"
                className="text-gray-1000 text-xs uppercase hover:underline underline-offset-2"
              >
                Command Center ↗
              </a>
              <CodeBadge />
            </header>

            <section className="lg:absolute lg:bottom-0 pb-6 w-fit z-10 relative mt-32">
              <div className="flex flex-col gap-y-8">
                <TotalRequests />
                <TopCountries />
              </div>
              <RegionCount />
            </section>

            <div className="w-full flex justify-end lg:pr-12">
              <GlobeContainer />
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
