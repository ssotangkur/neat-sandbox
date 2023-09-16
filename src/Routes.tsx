import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MainPage } from "./pages/MainPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
]);

export const Routes = () => <RouterProvider router={router} />;
