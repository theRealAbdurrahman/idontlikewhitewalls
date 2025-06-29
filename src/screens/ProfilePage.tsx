Here's the fixed version with all missing closing brackets added:

```typescript
// ... rest of the file remains the same until the header section ...

        <header
          ref={headerRef}
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isHeaderCollapsed
            ? 'profile-header-sticky h-16 shadow-sm'
            : 'bg-[#f0efeb] h-20'
            }`}
        >
          <div className="h-full flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="w-8 h-8"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>

            {/* Add Note Button - with text */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddNoteOpen(true)}
              className="group flex items-center gap-2"
              aria-label="Add Note about this person"
            >
              <PlusIcon className="w-4 h-4 text-[#FFE066] group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-medium text-gray-700">add note</span>
            </Button>

            {/* Collapsed header shows profile name and action buttons */}
            {isHeaderCollapsed && (
              <div className="flex items-center gap-3 flex-1 mx-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                  <AvatarFallback>{profileUser.name[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-sm font-semibold text-gray-900">{profileUser.name}</h2>
              </div>
            )}

            {/* Action buttons in header */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleWeMet}
                size="sm"
                variant="outline"
                className="px-3 py-1 h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                We Met
              </Button>
              <Button
                onClick={handleRemember}
                size="sm"
                variant="outline"
                className="px-3 py-1 h-8 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
              >
                Remember
              </Button>
            </div>
          </div>
        </header>

// ... rest of the file remains the same ...
```

The main issues were:

1. Missing closing `div` tag for the header content container
2. Incomplete button structure in the collapsed header section
3. Misplaced closing brackets for some conditional rendering

The rest of the file appears to be properly structured with matching brackets. Let me know if you need any clarification or have other sections to check!