/**
 * Barrel — lets pages do `import { Button, Card, Table } from "@/components/shared"`.
 * Named re-exports of the default exports keep call sites tidy.
 */
export { default as Button } from "./Button";
export { default as Card, CardHeader, CardBody, CardTitle } from "./Card";
export { default as StatCard } from "./StatCard";
export { default as Table, THead, TBody, TR, TH, TD } from "./Table";
export { default as Pagination } from "./Pagination";
export { default as Badge, statusTone } from "./Badge";
export { default as Avatar } from "./Avatar";
export { default as Input } from "./Input";
export { default as Select } from "./Select";
export { default as Modal } from "./Modal";
export { default as PageHeader } from "./PageHeader";
export { default as ComingSoon } from "./ComingSoon";
