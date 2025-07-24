import { Stack } from "@mui/material";
import { Typography as AntTypo, Button } from "antd";

const PrevNext = ({
  handlePrev,
  handleNext,
  prevDisabled,
  nextDisabled,
  isLastPage,
  totalPages,
  page,
}) => {
  return (
    <Stack
      direction={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      sx={{
        padding: "10px",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <Button type="primary" onClick={handlePrev} disabled={prevDisabled}>
        Prev
      </Button>
      {isLastPage ? (
        <AntTypo.Text type="secondary">This is the last page</AntTypo.Text>
      ) : (
        <AntTypo.Text type="secondary">
          Page {page} of {totalPages}{" "}
        </AntTypo.Text>
      )}
      <Button type="primary" onClick={handleNext} disabled={nextDisabled}>
        Next
      </Button>
    </Stack>
  );
};

export default PrevNext;
