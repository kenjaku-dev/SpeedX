export function GridBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="grid-backdrop pointer-events-none absolute inset-0 opacity-30"
      />
      <div aria-hidden="true" className="grid-fade pointer-events-none absolute inset-0" />
    </>
  )
}
