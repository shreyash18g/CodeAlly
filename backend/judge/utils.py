def normalize_output(text):

    text = text.strip()

    lines = text.splitlines()

    lines = [
        line.strip()
        for line in lines
        if line.strip()
    ]

    lines = [
        " ".join(
            line.split()
        )
        for line in lines
    ]

    return "\n".join(lines)