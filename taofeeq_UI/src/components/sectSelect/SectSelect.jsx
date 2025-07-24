import { AuthContext } from "../../context/authContext";
import { useContext } from "react";
import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const SectSelect = ({ inputs, handleChange, text = false }) => {
  const { currentUser } = useContext(AuthContext);

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Sect: </Typography.Text>
      <Typography.Text type="secondary">{inputs.sect}</Typography.Text>
    </Stack>
  ) : (
    <Select
      placeholder="Sect"
      value={inputs.sect}
      name="sect"
      onChange={(value) => {
        handleChange({
          target: {
            name: "sect",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Sect", disabled: true },
        ...[
          "Salafi",
          "Sunni",
          "Ahlul Hadith",
          "Just muslim",
          "Shia",
          "Barelwi",
          "Deobandi",
        ].map((value) => ({ value, label: value })),
      ]}
    />
  );
};

export default SectSelect;
