import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { CrossOverPage } from "./pages/CrossOverPage";
import { MainPage } from "./pages/MainPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "crossover",
    element: <CrossOverPage />,
  },
]);

export const Routes = () => <RouterProvider router={router} />;
