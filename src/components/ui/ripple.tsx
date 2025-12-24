export const Ripple = ({ x, y }: { x: number; y: number }) => {
    return (
        <span
            className="absolute block rounded-full animate-ripple duration-500"
            style={{
                left: x,
                top: y,
                backgroundColor: "hsl(var(--primary) / 0.3)",
                transform: "translate(-50%, -50%)",
                width: "200px",
                height: "200px",
                zIndex: 100,
            }}
        />
    );
};
