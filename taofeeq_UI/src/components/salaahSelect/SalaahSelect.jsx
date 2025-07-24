import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const SalaahSelect = ({
  inputs,
  handleChange,
  text = false,
  noEmpty = true,
}) => {
  const options = [
    {
      value: "",
      label: "Pattern of Salaah",
      disabled: true,
    },
    !noEmpty && {
      value: "Any",
      label: "Any",
    },
    {
      value: "always",
      label: "Always - I pray my 5 prayers always",
    },
    {
      value: "almostAlways",
      label: "Almost always - I pray 5 times a day and rarely miss",
    },
    {
      value: "regularly",
      label:
        "Regularly - I usually pray most of my prayers, except one or two sometimes",
    },
    {
      value: "sometimes",
      label: "Sometimes - I pray when I can or feel like it ",
    },
    {
      value: "rarely",
      label: "Rarely - Maybe Jumu'ah, Eid Salah or During Ramadan",
    },
    {
      value: "never",
      label: "Never or One-offs",
    },
  ];

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Pattern of Salaah: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.patternOfSalaah
          ? options.filter(
              (option) => option.value === inputs.patternOfSalaah
            )?.[0]?.label || "Not set"
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.patternOfSalaah}
      name="patternOfSalaah"
      onChange={(value) => {
        handleChange({
          target: {
            name: "patternOfSalaah",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={options.filter((item) => !!item)}
      placeholder={"Pattern of Salaah"}
    />
  );
};

export default SalaahSelect;
