import type { ComponentType, JSX } from "react";

import { IndexPage } from "@/pages/IndexPage/IndexPage";
import { ProfilePage } from "@/pages/ProfilePage/ProfilePage";
import Divination from "@/pages/Divination/Divination";
import ResultsPage from "@/pages/ResultsPage/ResultsPage";
import ExpandInsightsPage from "@/pages/ExpandInsightsPage/ExpandInsightsPage";
import ExpandedResultsPage from "@/pages/ExpandedResultsPage/ExpandedResultsPage";
import ConvertPage from "@/pages/ConvertPage/ConvertPage";
import JackpotPage from "@/pages/JackpotPage/JackpotPage";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: "/", Component: IndexPage },
  { path: "/profile", Component: ProfilePage, title: "Profile page" },
  { path: "/chat", Component: Divination, title: "Question Screen" },
  { path: "/results", Component: ResultsPage, title: "Results Page" },
  { path: "/expand-insights", Component: ExpandInsightsPage, title: "Expand Insights" },
  { path: "/expanded-results", Component: ExpandedResultsPage, title: "Expanded Insights" },
  { path: "/convert", Component: ConvertPage, title: "Convert Points" },
  { path: "/jackpot", Component: JackpotPage, title: "Jackpot Claim" },
];
