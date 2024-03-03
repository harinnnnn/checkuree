"use client";

import { Box, Button, CircularProgress, Grid, TextField } from "@mui/material";
import React, { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/utils";

export interface Login {
  username: string;
  password: string;
}

const index = () => {
  const router = useRouter();
  const [login, setLogin] = useState<Login>({
    username: "",
    password: "",
  });

  const fetchLogin = async (params: Login) => {
    const { username, password } = params;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signin`,
        {
          username: username,
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const token = response.data.access_token;
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      Cookies.set("access-token", response.data.access_token);
    } catch (error) {
      console.error("Error occurred during login:", error);
    }
  };
  const { mutate, isLoading } = useMutation(fetchLogin, {
    onSuccess: (data, variables, context) => {
      alert("로그인 되었습니다.");
      router.push("/attendancy/list");
    },
    onError: (error, variables, context) => {
      alert("존재하지 않는 계정이거나 비밀번호가 다릅니다.");
    },
  });

  // Hook
  const onChange = (field: string, value: string) => {
    setLogin((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  if (isLoading) {
    return <CircularProgress color="inherit" />;
  }

  return (
    <>
      <Box>
        <Grid container spacing={1} alignItems={"center"}>
          <Grid item xs={12} textAlign={"center"} marginBottom={"20px"}>
            <Button fullWidth variant="contained">
              출석이 로그인
            </Button>
          </Grid>
          <Grid item xs={5}>
            <div>ID</div>
          </Grid>
          <Grid item xs={7}>
            <TextField
              variant="outlined"
              value={login?.username}
              // disabled={isUpdate ? false : true}
              fullWidth
              onChange={(e) => onChange("username", e.target.value)}
            />
          </Grid>

          <Grid item xs={5}>
            <div>PW</div>
          </Grid>
          <Grid item xs={7}>
            <TextField
              variant="outlined"
              type="password"
              value={login?.password}
              fullWidth
              onChange={(e) => onChange("password", e.target.value)}
            />
          </Grid>
        </Grid>
        <Box mt={3} display={"flex"} justifyContent={"flex-end"} gap={"5px"}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              mutate(login);
            }}
          >
            로그인
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              router.push("/auth/register");
            }}
          >
            회원가입
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default index;
