import type { RouteObject } from "react-router-dom";
import { lazy } from "react";
import HomePage from "../pages/home/page";
import HistoryPage from "../pages/history/page";
import NotFound from "../pages/NotFound";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/history",
    element: <HistoryPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
