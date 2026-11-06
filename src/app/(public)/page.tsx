import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { getHomeData } from "@/server/services/home";
import { siteConfig } from "@/config/site";
import { Preloader } from "@/components/home/Preloader";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Discover } from "@/components/home/Discover";
import { FeaturedExperiences } from "@/components/home/FeaturedExperiences";
import { MoroccoMap } from "@/components/home/MoroccoMap";
import { WhyAzul } from "@/components/home/WhyAzul";
import { PlannerTeaser } from "@/components/home/PlannerTeaser";
import { Regions } from "@/components/home/Regions";
import { TravelStories } from "@/components/home/TravelStories";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { FinalCta } from "@/components/home/FinalCta";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: `${siteConfig.name} — ${siteConfig.descriptor}`,
    description: dict.meta.description,
    keywords: [...siteConfig.keywords],
    alternates: { canonical: "/" },
    openGraph: {
      title: `${siteConfig.name} — ${siteConfig.descriptor}`,
      description: dict.meta.description,
      url: "/",
      siteName: `${siteConfig.name} — ${siteConfig.descriptor}`,
      type: "website",
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getHomeData();

  return (
    <>
      <Preloader
        skipLabel={dict.home.preloader.skip}
        tagline={dict.home.preloader.tagline}
      />
      <Hero dict={dict.home.hero} stats={data.stats} />
      <Marquee text={`${siteConfig.descriptor} · ${dict.footer.tagline}`} />
      <Discover dict={dict.home.discover} />
      <FeaturedExperiences
        dict={dict.home.experiences}
        experiences={data.featured}
        locale={locale}
        bookNow={dict.common.bookNow}
      />
      <MoroccoMap dict={dict.home.map} destinations={data.destinations} />
      <WhyAzul dict={dict.home.why} />
      <PlannerTeaser dict={dict.home.planner} />
      <Regions dict={dict.home.regions} />
      <TravelStories
        dict={dict.home.stories}
        stories={data.stories}
        locale={locale}
      />
      <ReviewsStrip
        dict={dict.home.reviews}
        reviews={data.reviews}
        average={data.reviewStats.average}
        count={data.reviewStats.count}
      />
      <FinalCta dict={dict.home.finalCta} />
    </>
  );
}
