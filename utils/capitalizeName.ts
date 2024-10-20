function capitalizeName(str: string | undefined) {
    return str?.split(" ").map(name => name[0]?.toLocaleUpperCase() + name?.slice(1)).join(" ");
}

export default capitalizeName;