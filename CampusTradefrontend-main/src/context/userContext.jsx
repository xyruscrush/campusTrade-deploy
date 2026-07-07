import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [globaldata, setglobaldata] = useState(null);
  const [user, setUser] = useState(null);
  const [uploadData, setuploadData] = useState(null);
  const [cartData, setcartData] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (accessToken) {
          const response = await axios.post(
            "/api/get_items_secure",
            {},
            {
              withCredentials: true,
              headers: { Authorization: `Bearer ${accessToken}` },
            }

          );
          setglobaldata(response.data.data);
          setUser(response.data.user.email);
        } else {

          const response2 = await axios.post(
            "/api/check-refresh-token",
            {},
            { withCredentials: true }
          );
          if (response2.data.exists) {

            const response = await axios.post(
              "/api/refresh",
              {},
              {
                withCredentials: true,
              }
            );

            if (response.data.accessToken) {
              setAccessToken(response.data.accessToken);

              const response1 = await axios.post(
                "/api/get_items_secure",
                {},
                {
                  withCredentials: true,
                  headers: {

                    Authorization: `Bearer ${response.data.accessToken}`,
                  },
                }
              );
              setglobaldata(response.data.data);

              setUser(response.data.user.email);

            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [accessToken]);

  return (
    <UserContext.Provider
      value={{
        globaldata,
        setglobaldata,
        user,
        setUser,
        uploadData,
        setuploadData,
        cartData,
        setcartData,
        accessToken,
        setAccessToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
